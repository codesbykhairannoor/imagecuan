/**
 * IMAGECUAN - Configuration
 * Manage your upload targets and API keys here.
 */

export const CONFIG = {
  // Add your target SFTP servers here
  targets: [
    {
      id: "adobe-stock",
      name: "Adobe Stock",
      host: "sftp.stock.adobe.com",
      port: 22,
      username: process.env.ADOBE_USERNAME || "",
      password: process.env.ADOBE_PASSWORD || "",
      remoteDir: "/",
    },
    {
      id: "shutterstock",
      name: "Shutterstock",
      host: "ftps.shutterstock.com",
      port: 21,
      username: process.env.SHUTTERSTOCK_USERNAME || "",
      password: process.env.SHUTTERSTOCK_PASSWORD || "",
      remoteDir: "/",
    },
    {
      id: "dreamstime",
      name: "Dreamstime",
      host: "upload.dreamstime.com",
      port: 21,
      protocol: "ftp",
      username: process.env.DREAMSTIME_USERNAME || "",
      password: process.env.DREAMSTIME_PASSWORD || "",
      remoteDir: "/",
    },
    {
      id: "pond5",
      name: "Pond5",
      host: "ftp.pond5.com",
      port: 21,
      protocol: "ftp",
      username: process.env.POND5_USERNAME || "",
      password: process.env.POND5_PASSWORD || "",
      remoteDir: "/",
    },
    {
      id: "123rf",
      name: "123RF",
      host: "ftp.123rf.com",
      port: 21,
      protocol: "ftp",
      username: process.env.RF123_USERNAME || "",
      password: process.env.RF123_PASSWORD || "",
      remoteDir: "/",
    }
  ],
  
  // AI Configuration
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    dummyMode: false, // Set to true to test without real API/FTP
  },
  
  // Storage Paths
  paths: {
    raw: "./storage/raw",
    processed: "./storage/processed",
    logs: "./storage/logs",
  }
};
