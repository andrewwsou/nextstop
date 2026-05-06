type Props = {
  label: string;
  type?: string;
  placeholder?: string;
  isSelect?: boolean;
};

export default function AuthInput({ label, type = "text", placeholder, isSelect }: Props) {
  return (
    <div className="input-group">
      <label>{label}</label>
      {isSelect ? (
        <select defaultValue="">
          <option value="" disabled>{placeholder ?? "Select..."}</option>
          <option value="uci">UC Irvine</option>
          <option value="ucla">UCLA</option>
          <option value="usc">USC</option>
        </select>
      ) : (
        <input type={type} placeholder={placeholder} />
      )}
    </div>
  );
}