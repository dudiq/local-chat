export function getFilesFromClipboard(data?: DataTransfer): File[] {
  if (!data) {
    return [];
  }
  if (data.files.length > 0) {
    return [...data.files];
  }
  const dataItems = data.items;
  if (!Array.isArray(dataItems)) {
    return [];
  }
  if (dataItems.length === 0) {
    return [];
  }

  const files = dataItems.reduce<File[]>((acc, item) => {
    if (item.kind !== "file") {
      return acc;
    }
    const fileItem = item.getAsFile();
    if (!fileItem) {
      return acc;
    }
    acc.push(fileItem);
    return acc;
  }, []);

  return files;
}
