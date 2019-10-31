import { Rule, Tree, filter, applyTemplates, move, chain, mergeWith, apply, url, noop } from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { getWorkspace, buildDefaultPath, getReactConfig } from '../_utility/workspace';
import { parseName } from '../_utility/parse-name';
import { validateName } from '../_utility/validation';


// You don't have to export the function as default. You can also have more than one rule factory per file.
export function component(options: any): Rule {
  console.log('test');
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    const project = workspace.projects.get(options.project as string);
    const config = await getReactConfig(host, options);

    if (project) {
      options.path = `${buildDefaultPath(project || null)}${options.path}`;
    }

    if (config.styleExt) {
      options.styleExt = config.styleExt;
    }

    const parsedPath = parseName(options.path as string, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    validateName(options.name);

    const templateSource = apply(url('./files'), [
      options.styleExt ? noop() : filter(path => !path.endsWith('__styleExt@dasherize__.template')),
      options.type === 'func' ? filter(path => !path.endsWith('@if-class__.jsx.template')) : filter(path => path.endsWith('@if-func__.jsx.template')),
      applyTemplates({
        ...strings,
        'if-flat': (s: string) => options.flat ? '' : s,
        'if-class': () => '',
        'if-func': () => '',
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([
      mergeWith(templateSource)
    ]);
  };
}
