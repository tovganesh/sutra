import { Router } from 'express';
import { TreasuryController } from '../controllers/treasury.controller';

const router = Router();

router.get('/house-banks', TreasuryController.getHouseBanks);
router.post('/house-banks', TreasuryController.registerHouseBank);
router.get('/bank-accounts', TreasuryController.getBankAccounts);
router.post('/bank-accounts', TreasuryController.registerBankAccount);
router.get('/bank-accounts/:accountId/clearing-items', TreasuryController.getClearingItems);
router.post('/bank-accounts/:accountId/clearing-items', TreasuryController.addClearingItem);
router.get('/statements', TreasuryController.getStatements);
router.post('/statements/import-mt940', TreasuryController.importMt940);
router.post('/statements/:statementId/reconcile', TreasuryController.reconcileStatement);
router.get('/bank-accounts/:accountId/brs', TreasuryController.getBrs);
router.get('/bank-accounts/:accountId/cash-forecast', TreasuryController.getCashForecast);

export default router;
