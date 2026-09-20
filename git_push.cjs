const { execSync } = require('child_process');

const token = process.env.COUNSELLING_TRAINER_KEY?.trim();
if (!token) {
  console.error('COUNSELLING_TRAINER_KEY is empty or missing.');
  process.exit(1);
}

try {
  execSync('git init');
  execSync('git config user.name "athulg93"');
  execSync('git config user.email "athulgovind.1993@gmail.com"');
  execSync('git add .');
  
  try {
    execSync('git commit -m "feat: dynamic case studies, mobile UI enhancements, and supervisor relational distance tracking"');
  } catch (e) {
    console.log('Commit note: already committed or clean.');
  }

  execSync('git branch -M main');

  try {
    execSync('git remote remove origin');
  } catch (e) {}

  const remoteUrl = 'https://' + encodeURIComponent(token) + '@github.com/athulg93/counselling-trainer.git';
  execSync('git remote add origin ' + remoteUrl);

  console.log('Pushing to GitHub repository athulg93/counselling-trainer...');
  execSync('git push -u origin main --force', { stdio: 'inherit' });
  console.log('Successfully pushed latest code to GitHub!');

  // Clean remote URL so token is not left in git config
  try {
    execSync('git remote set-url origin https://github.com/athulg93/counselling-trainer.git');
  } catch (e) {}
} catch (err) {
  console.error('Git push failed:', err.message);
  process.exit(1);
}
