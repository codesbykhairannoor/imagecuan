/**
 * IMAGECUAN - Uploader Engine
 * Handles secure file transfers to stock photography servers.
 */

import { Client, ConnectConfig } from "ssh2";
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

export interface UploaderConfig extends ConnectConfig {
  id: string;
  name: string;
  protocol?: "sftp" | "ftp";
}

export class UploaderEngine {
  /**
   * Upload a file to an SFTP or FTP server.
   */
  async upload(localPath: string, remotePath: string, config: UploaderConfig): Promise<void> {
    if (config.protocol === "ftp") {
      return this.uploadFtp(localPath, remotePath, config);
    }
    return this.uploadSftp(localPath, remotePath, config);
  }

  private async uploadFtp(localPath: string, remotePath: string, config: UploaderConfig): Promise<void> {
    const client = new ftp.Client();
    // client.ftp.verbose = true;
    try {
      console.log(`[UploaderEngine] Connecting via FTP to ${config.name}`);
      await client.access({
        host: config.host,
        port: config.port || 21,
        user: config.username,
        password: config.password,
        secure: false
      });
      console.log(`[UploaderEngine] Uploading ${path.basename(localPath)} -> ${config.name}`);
      await client.uploadFrom(localPath, remotePath);
      console.log(`[UploaderEngine] Upload complete: ${path.basename(localPath)} -> ${config.name}`);
    } finally {
      client.close();
    }
  }

  private async uploadSftp(localPath: string, remotePath: string, config: UploaderConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on("ready", () => {
        console.log(`[UploaderEngine] Connected via SFTP to ${config.name}`);
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          
          const readStream = fs.createReadStream(localPath);
          const writeStream = sftp.createWriteStream(remotePath);
          
          writeStream.on("close", () => {
            console.log(`[UploaderEngine] Upload complete: ${path.basename(localPath)} -> ${config.name}`);
            conn.end();
            resolve();
          });
          
          writeStream.on("error", (err) => {
            conn.end();
            reject(err);
          });
          
          readStream.pipe(writeStream);
        });
      }).on("error", (err) => {
        reject(err);
      }).connect(config);
    });
  }
}

export const uploaderEngine = new UploaderEngine();
