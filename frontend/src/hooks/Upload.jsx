import { useRef } from 'react';

export function useFileUpload(onFileSelected) {
  const inputRef = useRef(null);

  const trigger = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    e.target.value = '';
  };

  const InputComponent = () => (
    <input
      ref={inputRef}
      type="file"
      onChange={handleChange}
      style={{ display: 'none' }}
    />
  );

  return { trigger, InputComponent };
}