import * as ftp from "basic-ftp";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    console.log("Connecting to FTP...");
    await client.access({
      host: "upload.dreamstime.com",
      port: 21,
      user: process.env.DREAMSTIME_USERNAME,
      password: process.env.DREAMSTIME_PASSWORD,
      secure: false
    });
    console.log("Connected!");
    const list = await client.list();
    console.log("FTP Directory Listing:");
    for (const item of list) {
      console.log(`- ${item.name} (${item.size} bytes)`);
    }
  } catch (err) {
    console.error("FTP Error:", err);
  } finally {
    client.close();
  }
}

listFTP();
