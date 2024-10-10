const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// packages 디렉토리 내의 모든 패키지를 탐색합니다.
const packagesDir = path.join(__dirname, 'packages');
const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
  return fs.statSync(path.join(packagesDir, dir)).isDirectory(); // 디렉토리인 경우만 필터링
});

// 현재 Git 태그 목록을 가져옵니다.
const existingTags = execSync('git tag', { encoding: 'utf-8' })
  .split('\n')
  .filter(tag => tag);

// 각 패키지에 대해 태그를 생성합니다.
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
});

// 모든 새 태그를 원격 저장소에 푸시
execSync('git push origin --tags');
console.log('All new tags pushed to origin.');
