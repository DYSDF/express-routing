import { normalize, extname } from 'path'
import { sync } from 'glob'

export function importFromDirectories(directories: string[], formats = ['.js', '.ts', '.tsx']): Function[] {
  const flat_modules_export = (exported: any, export_list: Function[]) => {
    if (exported instanceof Function) {
      export_list.push(exported);
    } else if (exported instanceof Array) {
      exported.forEach((i: any) => flat_modules_export(i, export_list));
    } else if (exported instanceof Object || typeof exported === 'object') {
      Object.keys(exported).forEach(key => flat_modules_export(exported[key], export_list));
    }
    return export_list;
  };

  const matched_files = directories.reduce(
    (acc, dir) => acc.concat(sync(normalize(dir))),
    [] as string[]
  );

  const required_modules = matched_files.filter(file => {
    const dts_ext = file.substring(file.length - 5, file.length);
    if (dts_ext === '.d.ts') return false
    return formats.indexOf(extname(file)) !== -1;
  }).map(file => require(file));

  return flat_modules_export(required_modules, []);
}
