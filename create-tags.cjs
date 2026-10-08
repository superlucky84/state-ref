const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// packages 디렉토리 내의 모든 패키지를 탐색합니다.
const packagesDir = path.join(__dirname, 'packages');
const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
  return fs.statSync(path.join(packagesDir, dir)).isDirectory(); // 디렉토리인 경우만 필터링
});

// 원격 태그를 먼저 받아옵니다. 로컬에 없는 원격 태그를 "없는 태그"로 보고
// 지금 커밋에 다시 만들면, 푸시가 거부되고 로컬에는 잘못된 태그가 남습니다.
execSync('git fetch origin --tags', { stdio: 'inherit' });

// 현재 Git 태그 목록을 가져옵니다.
const existingTags = execSync('git tag', { encoding: 'utf-8' })
  .split('\n')
  .filter(tag => tag);

// 각 패키지에 대해 태그를 생성합니다.
const createdTags = [];
packageDirs.forEach(packageName => {
  const pkgPath = path.join(packagesDir, packageName, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = pkg.version;

  // 모듈 이름과 버전을 기반으로 Git 태그 이름 생성
  const tagName = `${pkg.name}@${version}`;

  // 이미 태그가 존재하는지 확인
  if (existingTags.includes(tagName)) {
    console.log(`Tag ${tagName} already exists. Skipping.`);
    return; // 태그가 이미 존재하면 건너뜁니다.
  }

  // 태그 생성
  console.log(`Creating tag: ${tagName}`);
  execSync(`git tag ${tagName}`);
  createdTags.push(tagName);
});

// 이번에 만든 태그만 원격 저장소에 푸시합니다.
if (createdTags.length === 0) {
  console.log('No new tags to push.');
} else {
  execSync(`git push origin ${createdTags.map(tag => `"${tag}"`).join(' ')}`, {
    stdio: 'inherit',
  });
  console.log(`Pushed ${createdTags.length} new tag(s) to origin.`);
}
