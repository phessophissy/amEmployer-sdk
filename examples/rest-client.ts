import { AmEmployerClient } from '@phessophissy/amemployer-sdk';

async function main() {
  const client = new AmEmployerClient({
    apiUrl: 'https://api.amemployer.xyz',
    timeout: 15_000,
  });

  const [jobs, workers, activity] = await Promise.all([
    client.jobs.list(),
    client.workers.leaderboard(),
    client.stats.activity(),
  ]);

  console.log('Jobs:', jobs.total ?? jobs.data.length);
  console.log('Top workers:', workers.data.length);
  console.log('Recent activity:', activity.data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
