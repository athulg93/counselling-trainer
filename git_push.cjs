const { execSync } = require('child_process');

const token = process.env.COUNSELLING_TRAINER_KEY?.trim();
if (!token) {
  console.log('No token found, skipping git push.');
  process.exit(0);
}

try {
  execSync('git config user.name "athulg93"');
  execSync('git config user.email "athulgovind.1993@gmail.com"');
  execSync('git add .');
  
  try {
    execSync('git commit -m "feat: integrate Firebase Firestore cloud database and user password field"');
  } catch (e) {
    console.log('Nothing new to commit.');
  }

  const remoteUrl = 'https://' + encodeURIComponent(token) + '@github.com/athulg93/counselling-trainer.git';
  try {
    execSync('git remote remove origin');
  } catch(e) {}
  execSync('git remote add origin ' + remoteUrl);

  console.log('Pushing to GitHub repo athulg93/counselling-trainer...');
  execSync('git push -u origin main --force', { stdio: 'inherit' });
  console.log('Successfully pushed Firebase updates to GitHub!');

  try {
    execSync('git remote set-url origin https://github.com/athulg93/counselling-trainer.git');
  } catch (e) {}
} catch (err) {
  console.error('Git push note:', err.message);
}
