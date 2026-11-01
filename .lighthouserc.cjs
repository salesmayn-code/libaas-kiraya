module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/search?date=2027-02-10&city=Islamabad",
        "http://localhost:3000/listings/rlst_01M5HDJ590E7A4A3KKA38SZ0Y6",
      ],
      settings: {
        chromeFlags: "--no-sandbox --disable-gpu",
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
}
