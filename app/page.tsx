"use client";

import React, { useState, useEffect } from "react";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: "60px", textAlign: "center" }} className="animate-fade-in">
        <h1 className="text-gradient" style={{ fontSize: "4rem", fontWeight: "800", marginBottom: "10px", background: "linear-gradient(90deg, #00f2ff, #a200ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          IMAGECUAN
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", opacity: 0.8 }}>
          Mission Control: 100% Fully Automated AI Image Farm
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
          { label: "Target Sehari", value: "15-50", color: "#00f2ff", desc: "Gambar AI Otomatis" },
          { label: "Jadwal Bot", value: "3x / Hari", color: "#a200ff", desc: "Setiap Jam 09, 17, 01" },
          { label: "Sistem AI", value: "Aktif", color: "#00ff88", desc: "HuggingFace SDXL & BLIP" },
          { label: "Toko Aktif", value: "4", color: "#ffcc00", desc: "Dreamstime, Pond5, 123RF, dll" },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: "24px", textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ color: "#aaa", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              {stat.label}
            </p>
            <h2 style={{ fontSize: "2.5rem", marginTop: "10px", color: stat.color }}>{stat.value}</h2>
            <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "5px" }}>{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Autopilot Zone */}
        <div className="glass-card" style={{ 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(0, 255, 136, 0.3)",
          background: "linear-gradient(180deg, rgba(0,255,136,0.05) 0%, rgba(0,0,0,0) 100%)",
          borderRadius: "20px",
          minHeight: "300px",
        }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "20px", 
            background: "rgba(0, 255, 136, 0.2)", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            boxShadow: "0 0 20px rgba(0, 255, 136, 0.4)"
          }}>
            <span style={{ fontSize: "2.5rem" }}>🤖</span>
          </div>
          <h3 style={{ fontSize: "1.8rem", marginBottom: "10px", color: "#00ff88" }}>Autopilot is Running</h3>
          <p style={{ color: "#aaa", textAlign: "center", maxWidth: "400px", lineHeight: "1.6" }}>
            Robot AI sedang bekerja di latar belakang (GitHub Actions). Gambar bergaya Flat Vector secara otomatis dibuat, di-tagging, dan di-upload tanpa perlu kamu menekan tombol apapun.
          </p>
        </div>

        {/* Target Status */}
        <div className="glass-card" style={{ padding: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "#fff" }}>Target Integrasi FTP</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {["Dreamstime", "Pond5", "123RF", "Adobe Stock"].map((name, i) => (
              <div key={i} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px"
              }}>
                <span style={{ color: "#ccc" }}>{name}</span>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "6px", 
                  fontSize: "0.7rem",
                  background: i < 3 ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
                  color: i < 3 ? "#00ff88" : "#666"
                }}>
                  {i < 3 ? "ONLINE" : "PENDING"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ 
        marginTop: "40px", 
        padding: "20px", 
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)"
      }}>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Dashboard ini sangat ringan (Statik UI) & di-hosting gratis di Vercel. Beban kerja utama (CPU) 100% diproses di GitHub Actions.
        </p>
      </div>
    </main>
  );
}
