/**
 * Notion Exporter client.
 * The original implementation is available at https://github.com/yannbolliger/notion-exporter
 */

import axios, { AxiosInstance } from 'axios';
import AdmZip from 'adm-zip';

interface Task {
  id: string;
  state: string;
  status: { exportURL?: string };
}

/** Configuration options that are passed to the Notion API. */
interface Config {
  /** Export children subpages recursively. Default: false */
  recursive?: boolean;
  /** Default: UTC */
  timeZone?: string;
  /** Default: en */
  locale?: string;
  /** Export all blocks of the DB/page or just the ones in the current view. Default: "all" */
  collectionViewExportType?: 'currentView' | 'all';
  /** Poll export task finished interval in ms */
  pollInterval?: number;
}

export const defaultConfig: Config = {
  timeZone: 'UTC',
  locale: 'en',
  collectionViewExportType: 'all',
  pollInterval: 1000,
};

const toUuid = (id: string): string => {
  const uuid = id.replace(/-/g, '');
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
};

export class NotionExporter {
  protected readonly client: AxiosInstance;
  private readonly config: Config;

  /**
   * Create a new NotionExporter client. To export any blocks/pages from
   * Notion.so one needs to provide the token of a user who has read access to
   * the corresponding pages.
   *
   * @param tokenV2 – the Notion `token_v2` Cookie value
   * @param fileToken – the Notion `file_token` Cookie value
   */
  constructor(tokenV2: string, fileToken: string, config?: Config) {
    this.client = axios.create({
      baseURL: 'https://www.notion.so/api/v3/',
      headers: {
        Cookie: `token_v2=${tokenV2};file_token=${fileToken}`,
      },
    });
    this.config = Object.assign({}, defaultConfig, config);
  }

  /**
   * Adds a an 'exportBlock' task to the Notion API's queue of tasks.
   *
   * @param id BlockId of the page/block/DB to export
   * @returns The task's id
   */
  async getTaskId(id: string): Promise<string> {
    const blockId = toUuid(id);

    const { recursive, ...config } = this.config;
    const res = await this.client.post('enqueueTask', {
      task: {
        eventName: 'exportBlock',
        request: {
          block: { id: blockId },
          // Recursive needs to be set
          recursive: !!recursive,
          shouldExportComments: false,
          exportOptions: {
            exportType: 'markdown',
            ...config,
          },
        },
      },
    });
    return res.data.taskId;
  }

  private getTask = async (taskId: string): Promise<Task> => {
    const res = await this.client.post('getTasks', { taskIds: [taskId] });
    return res.data.results.find((t: Task) => t.id === taskId);
  };

  private pollTask = (taskId: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const interval = this.config.pollInterval || defaultConfig.pollInterval;
      const poll = async () => {
        const task = await this.getTask(taskId);
        if (task.state === 'success' && task.status.exportURL)
          resolve(task.status.exportURL);
        else if (task.state === 'in_progress' || task.state === 'not_started') {
          setTimeout(poll, interval);
        } else {
          console.error(taskId, task);
          reject(`Export task failed: ${taskId}.`);
        }
      };
      setTimeout(poll, interval);
    });

  /**
   * Starts an export of the given block and
   *
   * @param id BlockId of the page/block/DB to export
   * @returns The URL of the exported ZIP archive
   */
  getZipUrl = (id: string): Promise<string> =>
    this.getTaskId(id).then(this.pollTask);

  /**
   * Downloads the ZIP at the given URL.
   *
   * @returns The ZIP as an 'AdmZip' object
   */
  private downloadZip = async (url: string): Promise<AdmZip> => {
    const res = await this.client.get(url, { responseType: 'arraybuffer' });
    return new AdmZip(res.data);
  };

  getZip = (id: string): Promise<AdmZip> =>
    this.getZipUrl(id).then(this.downloadZip);

  /**
   * Downloads and extracts all files in the exported zip to the given folder.
   *
   * @param id BlockId of the page/block/DB to export
   * @param path Folder path where the files are unzipped
   */
  getMdFiles = async (id: string, path: string): Promise<void> => {
    const zip = await this.getZip(id);
    zip.extractAllTo(path);
  };

  /**
   * Exports the given block as ZIP and downloads it. Returns the matched file
   * in the ZIP as a string.
   *
   * @param id BlockId of the page/block/DB to export
   * @param predicate - Returns true for the zip entry to be extracted
   * @returns The matched file as string
   */
  async getFileString(
    id: string,
    predicate: (entry: AdmZip.IZipEntry) => boolean
  ): Promise<string> {
    const zip = await this.getZip(id);
    const entry = zip.getEntries().find(predicate);
    return (
      entry?.getData().toString().trim() ||
      Promise.reject('Could not find file in ZIP.')
    );
  }

  /**
   * Downloads and extracts the first CSV file of the exported block as string.
   *
   * @param id BlockId of the page/block/DB to export
   * @param onlyCurrentView - If true, only the current view is exported
   * @returns The extracted CSV string
   */
  getCsvString = (id: string, onlyCurrentView?: boolean): Promise<string> =>
    this.getFileString(id, (e) =>
      e.name.endsWith(onlyCurrentView ? '.csv' : '_all.csv')
    );

  /**
   * Downloads and extracts the first Markdown file of the exported block as string.
   *
   * @param id BlockId of the page/block/DB to export
   * @returns The extracted Markdown string
   */
  getMdString = (id: string): Promise<string> =>
    this.getFileString(id, (e) => e.name.endsWith('.md'));

  /**
   * Exports the given block as ZIP and downloads it. Returns all the matched files
   * in the ZIP as a string.
   *
   * @param id BlockId of the page/block/DB to export
   * @param predicate - Returns true for the zip entry to be extracted
   * @returns The matched files as string
   */
  async getAllFileString(
    id: string,
    predicate: (entry: AdmZip.IZipEntry) => boolean
  ): Promise<string[]> {
    const zip = await this.getZip(id);
    const entries = zip.getEntries().filter(predicate);
    return (
      entries?.map((entry) => entry.getData().toString().trim()) ||
      Promise.reject('Could not find file in ZIP.')
    );
  }

  /**
   * Downloads and extracts the Markdown files of the exported block as string.
   *
   * @param id BlockId of the page/block/DB to export
   * @returns The extracted Markdown string
   */
  getAllMdString = (id: string): Promise<string[]> =>
    this.getAllFileString(id, (e) => e.name.endsWith('.md'));
}
