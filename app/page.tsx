"use client";

import React, { useState, useEffect } from "react";
// Note: These will work after you clear space on C: and run npm install
// import { Upload, Shield, Zap, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
// import { motion } from "framer-motion";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "60px", textAlign: "center" }} className="animate-fade-in">
        <h1 className="text-gradient" style={{ fontSize: "4rem", fontWeight: "800", marginBottom: "10px" }}>
          IMAGECUAN
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
          Super Charged Image Automation for Stock Photography
        </p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "20px",
        marginBottom: "40px" 
      }}>
        {[
          { label: "Files in Queue", value: "0", color: "var(--accent-cyan)" },
          { label: "Processed Today", value: "0", color: "var(--accent-purple)" },
          { label: "Successful Uploads", value: "0", color: "#00ff88" },
          { label: "Active Targets", value: "2", color: "#ffcc00" },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              {stat.label}
            </p>
            <h2 style={{ fontSize: "2.5rem", marginTop: "10px", color: stat.color }}>{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Upload Zone */}
        <div className="glass-card" style={{ 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed var(--glass-border)",
          minHeight: "300px",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "20px", 
            background: "rgba(0, 242, 255, 0.1)", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
            <span style={{ fontSize: "2rem" }}>🚀</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Drop your images here</h3>
          <p style={{ color: "var(--text-secondary)" }}>AI will handle tagging, SEO, and multi-platform upload</p>
          <button style={{ 
            marginTop: "20px",
            padding: "12px 32px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))",
            color: "white",
            border: "none",
            fontWeight: "600",
            cursor: "pointer"
          }}>
            Select Files
          </button>
        </div>

        {/* Target Status */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Upload Targets</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {["Adobe Stock", "Shutterstock", "Freepik", "Alamy"].map((name, i) => (
              <div key={i} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px"
              }}>
                <span>{name}</span>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "6px", 
                  fontSize: "0.7rem",
                  background: i < 2 ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
                  color: i < 2 ? "#00ff88" : "#666"
                }}>
                  {i < 2 ? "ACTIVE" : "PENDING"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Warning */}
      <div className="glass-card" style={{ 
        marginTop: "20px", 
        padding: "20px", 
        border: "1px solid rgba(255, 100, 100, 0.3)",
        background: "rgba(255, 100, 100, 0.05)"
      }}>
        <h4 style={{ color: "#ff6464", marginBottom: "5px" }}>⚠️ System Notice</h4>
        <p style={{ color: "#ff6464", opacity: 0.8, fontSize: "0.9rem" }}>
          Drive C: is full (0 bytes free). Please clear space to enable AI processing and module installation.
        </p>
      </div>
    </main>
  );
}
