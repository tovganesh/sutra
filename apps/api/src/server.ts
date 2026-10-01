import app from './app';
import { aiProvider } from './services/engine.registry';
import { t } from './helpers/i18n.helper';

const PORT = process.env.PORT || 4000;

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`🚀 ${t('system.name')}`);
  console.log(`🌐 ${t('system.gatewayOnline', { port: PORT })}`);
  console.log(`🇮🇳 ${t('system.builtForIndia')}`);
  console.log(`🤖 ${t('system.aiEngine', { provider: aiProvider.name })}`);
  console.log(`=================================================================`);
});

export { app, server };
export default app;
