import process from "node:process";

console.log("Using GitHub Actions for blog generation. Skipping old Netlify generator.");
process.exitCode = 0;
