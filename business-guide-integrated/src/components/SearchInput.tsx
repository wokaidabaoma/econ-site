import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchInput({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="请输入关键词（如学校、项目方向、托福要求）"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '1rem',
          border: '1px solid #ccc',
          borderRadius: '6px'
        }}
      />
    </div>
  );
}

// ✅ 末尾添加这一句
export {};
