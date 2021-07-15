import { normalize, extname } from 'path'
import { sync } from 'glob'

export function importFromDirectories(directories: string[], formats = ['.js', '.ts', '.tsx']): Function[] {
  const loadFileClasses = (exported: any, loaded_list: Function[]) => {
    if (exported instanceof Function) {
      loaded_list.push(exported);
    } else if (exported instanceof Array) {
      exported.forEach((i: any) => loadFileClasses(i, loaded_list));
    } else if (exported instanceof Object || typeof exported === 'object') {
      Object.keys(exported).forEach(key => loadFileClasses(exported[key], loaded_list));
    }
    return loaded_list;
  };

  const matched_files = directories.reduce((acc, dir) => {
    return acc.concat(sync(normalize(dir)));
  }, [] as string[]);

  const imported_files = matched_files.filter(file => {
    const dts_ext = file.substring(file.length - 5, file.length);
    if (dts_ext === '.d.ts') return false
    return formats.indexOf(extname(file)) !== -1;
  }).map(file => require(file));

  return loadFileClasses(imported_files, []);
}
