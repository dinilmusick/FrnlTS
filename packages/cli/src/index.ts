import { generateComponent } from './generators/componentGenerator.js';
import { runBuild } from './commands/build.js';
import { runDev } from './commands/dev.js';
import { inspectComponent } from './commands/inspect.js';
import { runValidate } from './commands/validate.js';
import { runWatch } from './commands/watch.js';

export { generateComponent, runBuild, runDev, inspectComponent, runValidate, runWatch };

export async function runFrnlCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, type, name, ...rest] = argv;
  const root = process.cwd();

  if (command === 'generate' && type === 'component') {
    const states = rest.filter((arg) => arg.startsWith('--state=')).map((arg) => arg.slice(8));
    const events = rest.filter((arg) => arg.startsWith('--event=')).map((arg) => arg.slice(8));
    generateComponent(name, root, { states, events });
    console.log('Created Frnl component ' + name + '.');
    return 0;
  }

  if (command === 'validate') return runValidate(root);
  if (command === 'build') return runBuild(root);
  if (command === 'dev') return runDev(root);
  if (command === 'watch') {
    runWatch(root);
    return 0;
  }
  if (command === 'inspect' && type === 'component' && name) {
    inspectComponent(name, root);
    return 0;
  }

  console.error('Usage: frnl generate component <Name> [--state=Idle] [--event=Click] | frnl validate | frnl build | frnl dev | frnl watch | frnl inspect component <Name>');
  return 1;
}
