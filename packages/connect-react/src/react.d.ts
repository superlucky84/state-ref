declare module 'react' {
  // 기본 내보내기
  const react: {
    useState: any;
    useRef: any;
    useEffect: any;
  };
  export = react;
}
