import NotionExporter from 'notion-exporter';
import AdmZip from 'adm-zip';

export class ExtendedNotionExporter extends NotionExporter.default {
  /**
   * Exports the given block as ZIP and downloads it. Returns all the matched files
   * in the ZIP as a string.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @param predicate - Returns true for the zip entry to be extracted
   * @returns The matched files as string
   */
  async getAllFileString(
    idOrUrl: string,
    predicate: (entry: AdmZip.IZipEntry) => boolean
  ): Promise<string[]> {
    const zip = await this.getZip(idOrUrl);
    const entries = zip.getEntries().filter(predicate);
    return (
      entries?.map((entry) => entry.getData().toString().trim()) ||
      Promise.reject('Could not find file in ZIP.')
    );
  }

  /**
   * Downloads and extracts the Markdown files of the exported block as string.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @returns The extracted Markdown string
   */
  getAllMdString = (idOrUrl: string): Promise<string[]> =>
    this.getAllFileString(idOrUrl, (e) => e.name.endsWith('.md'));
}
