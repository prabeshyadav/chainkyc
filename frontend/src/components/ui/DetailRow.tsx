export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-ink-600 shrink-0">{label}</span>
      <span className="text-ink-900 font-medium text-right wrap-break-word">
        {value || "—"}
      </span>
    </div>
  );
}

export default function PersonalDetail({
  fullName,
  dob,
  country,
  nationality,
  phoneNumber,
  email,
  address,
}: {
  fullName: string | undefined;
  dob: string | undefined;
  country: string | undefined;
  nationality: string | undefined;
  phoneNumber: string | undefined;
  email: string | undefined;
  address: string | undefined;
}) {
  return (
    <div className="border border-line rounded-lg divide-y divide-line mt-4">
      <DetailRow label="Full legal name" value={fullName} />
      <DetailRow label="Date of birth" value={dob} />
      <DetailRow label="Country" value={country} />
      <DetailRow label="Nationality" value={nationality} />
      <DetailRow label="Phone number" value={phoneNumber} />
      <DetailRow label="Email" value={email} />
      <DetailRow label="Permanent Address" value={address} />
    </div>
  );
}
