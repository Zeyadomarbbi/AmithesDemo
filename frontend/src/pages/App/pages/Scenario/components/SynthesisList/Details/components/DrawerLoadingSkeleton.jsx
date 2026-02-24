// DrawerLoadingSkeleton.jsx
// Drop-in loading state for SynthesisDetailsDrawer

import React from 'react';

const pulse = `
@keyframes shimmer {
  0% { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
`;

const skeletonBase = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '600px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: '3px',
};

function Skel({ w = '100%', h = 12, style = {} }) {
  return <div style={{ ...skeletonBase, width: w, height: h, ...style }} />;
}

const ROW_COUNT = 10;

export default function DrawerLoadingSkeleton() {
  return (
    <>
      <style>{pulse}</style>

      {/* Header */}
      <div style={{
        padding: '24px 28px 20px',
        borderBottom: '1px solid rgba(204,205,206,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skel w={220} h={18} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skel w={28} h={28} style={{ borderRadius: 6 }} />
            <Skel w={28} h={28} style={{ borderRadius: 6 }} />
          </div>
        </div>
        <Skel w={340} h={12} />

        {/* Scenario tab pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {[90, 110, 95, 105].map((w, i) => (
            <Skel key={i} w={w} h={28} style={{ borderRadius: 20, opacity: i === 0 ? 1 : 0.55 }} />
          ))}
        </div>
      </div>

      {/* KPI Table */}
      <div style={{ padding: '0 28px', flex: 1 }}>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px repeat(4, 1fr)',
          gap: 12,
          padding: '16px 0 10px',
          borderBottom: '1px solid rgba(204,205,206,0.35)',
        }}>
          <Skel w={60} h={10} />
          {[80, 90, 75, 85].map((w, i) => (
            <Skel key={i} w={w} h={10} style={{ justifySelf: 'end' }} />
          ))}
        </div>

        {/* KPI rows */}
        {Array.from({ length: ROW_COUNT }).map((_, i) => {
          const isGroupHeader = i === 0 || i === 5 || i === 8;
          const indent = !isGroupHeader;
          const delayStyle = { animationDelay: `${i * 0.05}s` };
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px repeat(4, 1fr)',
                gap: 12,
                padding: '11px 0',
                borderBottom: '1px solid rgba(204,205,206,0.2)',
                opacity: 1 - i * 0.04,
              }}
            >
              <Skel
                w={indent ? 100 + (i % 3) * 20 : 140}
                h={isGroupHeader ? 11 : 10}
                style={{ marginLeft: indent ? 14 : 0, ...delayStyle }}
              />
              {[55, 60, 50, 58].map((w, j) => (
                <Skel
                  key={j}
                  w={w}
                  h={10}
                  style={{ justifySelf: 'end', ...delayStyle }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}