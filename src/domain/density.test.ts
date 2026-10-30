import { describe,expect,it } from 'vitest';
import { applyCommand,createInitialState,migrateState,preferencesSchema } from './workspace';
import { createBackup,parseBackup,restoreBackup } from './backup';

const now=new Date('2026-10-27T14:00:00Z');
describe('display density preference',()=>{
  it('accepts existing records/backups without a density and preserves their tasks',()=>{
    const original=createInitialState(now); delete original.preferences.density;
    const loaded=migrateState(JSON.parse(JSON.stringify(original)));
    expect(loaded.tasks).toEqual(original.tasks); expect(loaded.preferences.density ?? 'default').toBe('default');
    expect(parseBackup(JSON.stringify(createBackup(original,now,true))).preferences.density ?? 'default').toBe('default');
  });
  it('saves density through the preference command and backup/restore without modifying tasks',()=>{
    const original=createInitialState(now);
    const compact=applyCommand(original,{type:'preferences',operationId:'density',preferences:{...original.preferences,density:'compact'}},now);
    expect(compact.preferences.density).toBe('compact'); expect(compact.tasks).toEqual(original.tasks);
    const bundle=parseBackup(JSON.stringify(createBackup(compact,now,true)));
    expect(restoreBackup(original,bundle,{mode:'replace',conflicts:'keep'},'fixture').preferences.density).toBe('compact');
    expect(preferencesSchema.safeParse({...original.preferences,density:'unexpected'}).success).toBe(false);
  });
});
