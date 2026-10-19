import { generateComponent } from './generators/componentGenerator.js';
import { formatValidation, validateFrnlWorkspace } from '@dinilmusick/frnlts-validate';

export { generateComponent };

export async function runFrnlCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, type, name, ...rest] = argv;
  const root = process.cwd();

  if (command === 'generate' && type === 'component') {
    const states = rest.flatMap((arg) => arg.startsWith('--state=') ? [arg.slice(8)] : []);
    const events = rest.flatMap((arg) => arg.startsWith('--event=') ? [arg.slice(8)] : []);
    generateComponent(name, root, { states, events });
    console.log(`Created Frnl component ${name}.`);
    return 0;
  }

  if (command === 'validate') {
    const result = validateFrnlWorkspace(root);
    console.log(formatValidation(result));
    return result.passed ? 0 : 1;
  }

  console.error('Usage: frnl generate component <Name> [--state=Idle] [--event=Click] | frnl validate');
  return 1;
}
