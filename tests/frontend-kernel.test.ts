import { describe, expect, it } from 'vitest';
import { createLifecycle, defineContract, defineCommand } from '../src/runtime/kernel.js';
import { createScope, defineResource } from '../src/runtime/resources.js';
import { FrnlRegistry } from '../src/runtime/registry.js';
import { validateAccessibility } from '../src/runtime/accessibility.js';

describe('frontend kernel foundations',()=>{
 it('enforces lifecycle transitions',()=>{const x=createLifecycle();x.transition('initializing');x.transition('mounted');x.transition('active');expect(()=>x.transition('created')).toThrow();});
 it('validates contracts and commands',()=>{expect(defineContract({id:'button',version:1,commands:['click']}).version).toBe(1);expect(defineCommand('save').id).toBe('save');});
 it('releases owned resources with a scope',async()=>{let released=0;const r=defineResource({id:'data',acquire:()=>123,release:()=>{released++}});const scope=createScope('page');const c=scope.add(r);await expect(c.load()).resolves.toBe(123);await scope.dispose();expect(released).toBe(1);expect(c.status).toBe('released');});
 it('enforces registry capabilities',()=>{const r=new FrnlRegistry();r.register({id:'dialog',version:1,contract:{id:'dialog',version:1,capabilities:['focus']},value:1});expect(r.resolve('dialog')).toBe(1);expect(()=>r.requireCapabilities('dialog',[])).toThrow();expect(()=>r.requireCapabilities('dialog',['focus'])).not.toThrow();});
 it('validates accessibility requirements',()=>{expect(validateAccessibility({role:'dialog',nameRequired:true},{role:'dialog'}).length).toBe(1);expect(validateAccessibility({role:'dialog',nameRequired:true},{role:'dialog','aria-label':'Settings'})).toEqual([]);});
});