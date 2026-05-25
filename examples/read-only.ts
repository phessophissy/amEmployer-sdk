import { AmEmployer, CHAIN_IDS } from '@phessophissy/amemployer-sdk';

async function main() {
  const sdk = new AmEmployer({
    apiUrl: 'https://api.amemployer.xyz',
    rpcUrl: 'https://forno.celo.org',
  });

  const [stats, openTasks] = await Promise.all([
    sdk.taskManager.getPlatformStats(),
    sdk.client.tasks.listOpen(),
  ]);

  console.log('Celo chain:', CHAIN_IDS.CELO_MAINNET);
  console.log('On-chain stats:', stats);
  console.log('Open task count:', openTasks.data.length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
