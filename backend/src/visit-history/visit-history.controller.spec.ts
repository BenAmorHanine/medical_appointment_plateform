import { Test, TestingModule } from '@nestjs/testing';
import { VisitHistoryController } from './visit-history.controller';

describe('VisitHistoryController', () => {
  let controller: VisitHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitHistoryController],
    }).compile();

    controller = module.get<VisitHistoryController>(VisitHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
