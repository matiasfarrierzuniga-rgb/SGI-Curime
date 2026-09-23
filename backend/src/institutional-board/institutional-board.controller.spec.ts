import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { InstitutionalBoardController } from './institutional-board.controller';
describe('InstitutionalBoardController capabilities', () => {
  it.each([['listTerms','adm.institutional-board.read'],['getTerm','adm.institutional-board.read'],['candidates','adm.institutional-board.read'],['createTerm','adm.institutional-board.manage'],['updateTerm','adm.institutional-board.manage'],['createAppointment','adm.institutional-board.manage'],['updateAppointment','adm.institutional-board.manage']])('protects %s', (method, capability) => {
    expect(Reflect.getMetadata(CAPABILITIES_KEY, InstitutionalBoardController.prototype[method as keyof InstitutionalBoardController])).toEqual([capability]);
  });
});
