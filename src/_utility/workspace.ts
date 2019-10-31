import { virtualFs, workspaces } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';

function createHost(tree: Tree): workspaces.WorkspaceHost {
    return {
        async readFile(path: string): Promise<string> {
            const data = tree.read(path);
            if (!data) {
                throw new Error('File not found.');
            }

            return virtualFs.fileBufferToString(data);
        },
        async writeFile(path: string, data: string): Promise<void> {
            return tree.overwrite(path, data);
        },
        async isDirectory(path: string): Promise<boolean> {
            // approximate a directory check
            return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
        },
        async isFile(path: string): Promise<boolean> {
            return tree.exists(path);
        },
    };
}

export async function getWorkspace(tree: Tree, path = '/') {
    const host = createHost(tree);

    const { workspace } = await workspaces.readWorkspace(path, host);

    return workspace;
}

/**
 * Build a default project path for generating.
 * @param project The project which will have its default path generated.
 */
export function buildDefaultPath(project: workspaces.ProjectDefinition): string {
    return project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
}

export async function createDefaultPath(tree: Tree, projectName: string): Promise<string> {
    const workspace = await getWorkspace(tree);
    const project = workspace.projects.get(projectName);
    if (!project) {
        throw new Error('Specified project does not exist.');
    }

    return buildDefaultPath(project);
}

export async function getReactConfig(host: Tree, options: any): Promise<Config> {
    const workspace = await getWorkspace(host);
    const project = workspace.projects.get(options.project as string);

    return require(`${process.cwd()}/${project ? `${project.root}/` : ''}react.json`);
}

interface Config {
    styleExt: 'css' | 'scss' | 'sass' | 'less' | 'styl' | 'jss',
}
