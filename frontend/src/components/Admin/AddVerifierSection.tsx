import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAddVerifier, useRemoveVerifier } from "../../queries/admin";
import { Button, Input, SectionCard } from "../ui";

interface Verifier {
  wallet: string;
  name?: string;
  addedOn: string;
}

const initialVerifiers: Verifier[] = [
  {
    wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    name: "NRB Verifier Cell",
    addedOn: "Added May 12, 2026",
  },
  {
    wallet: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    name: "Verify Nepal Pvt. Ltd.",
    addedOn: "Added Jun 3, 2026",
  },
];

const verifierSchema = z.object({
  wallet: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      "Enter a valid wallet address (0x followed by 40 hex characters)",
    ),
});

type VerifierFormValues = z.infer<typeof verifierSchema>;

const AddVerifierSection = () => {
  const [verifiers, setVerifiers] = useState<Verifier[]>(initialVerifiers);
  const addVerifier = useAddVerifier();
  const removeVerifier = useRemoveVerifier();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<VerifierFormValues>({
    resolver: zodResolver(verifierSchema),
    defaultValues: { wallet: "" },
  });

  const onAddVerifier = handleSubmit(({ wallet }) => {
    if (
      verifiers.some((v) => v.wallet.toLowerCase() === wallet.toLowerCase())
    ) {
      setError("wallet", { message: "This wallet is already a verifier." });
      return;
    }
    addVerifier.mutate(wallet, {
      onSuccess: () => {
        setVerifiers((list) => [{ wallet, addedOn: "Added today" }, ...list]);
        reset();
      },
    });
  });

  function onRemoveVerifier(wallet: string) {
    removeVerifier.mutate(wallet, {
      onSuccess: () => {
        setVerifiers((list) => list.filter((v) => v.wallet !== wallet));
      },
    });
  }
  return (
    <SectionCard
      title="Verifiers"
      description="Licensed verifiers allowed to review KYC submissions."
    >
      <form onSubmit={onAddVerifier} className="flex items-start gap-3 mb-5">
        <div className="flex-1">
          <Input
            label="Verifier wallet address"
            hint="0x..."
            error={errors.wallet?.message}
            {...register("wallet")}
          />
          {addVerifier.isError && (
            <p className="text-xs text-red-600 mt-1">
              {addVerifier.error.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={addVerifier.isPending} className="mt-7">
          {addVerifier.isPending ? "Adding..." : "Add verifier"}
        </Button>
      </form>

      {verifiers.length === 0 ? (
        <p className="text-sm text-ink-400">No verifiers on the network yet.</p>
      ) : (
        <div className="space-y-3">
          {verifiers.map((v) => {
            const removing =
              removeVerifier.isPending && removeVerifier.variables === v.wallet;
            return (
              <div
                key={v.wallet}
                className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">
                  VF
                </div>
                <div className="flex-1 min-w-0">
                  {v.name && (
                    <p className="font-medium text-ink-900 text-sm">{v.name}</p>
                  )}
                  <p className="text-xs text-ink-600 font-mono truncate">
                    {v.wallet}
                  </p>
                  <p className="text-xs text-ink-400">{v.addedOn}</p>
                </div>
                <Button
                  variant="danger"
                  disabled={removing}
                  onClick={() => onRemoveVerifier(v.wallet)}
                >
                  {removing ? "Removing..." : "Remove"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {removeVerifier.isError && (
        <p className="text-sm text-red-600 mt-3">
          {removeVerifier.error.message}
        </p>
      )}
      <p className="text-xs text-ink-400 mt-4">
        This list is demo data until a list-verifiers API exists — add and
        remove actions call the network for real.
      </p>
    </SectionCard>
  );
};

export default AddVerifierSection;
