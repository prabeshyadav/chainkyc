import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  useAddVerifier,
  useRemoveVerifier,
  useVerifiers,
} from "../../queries/admin";
import { Button, Input, SectionCard } from "../ui";

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
  const { data: verifiers = [], isLoading, isError, error } = useVerifiers();
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
    if (verifiers.some((v) => v.toLowerCase() === wallet.toLowerCase())) {
      setError("wallet", { message: "This wallet is already a verifier." });
      return;
    }
    addVerifier.mutate(wallet, {
      onSuccess: () => reset(),
    });
  });

  function onRemoveVerifier(wallet: string) {
    removeVerifier.mutate(wallet);
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

      {isLoading ? (
        <p className="text-sm text-ink-400">Loading verifiers...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          Could not load verifiers: {error.message}
        </p>
      ) : verifiers.length === 0 ? (
        <p className="text-sm text-ink-400">No verifiers on the network yet.</p>
      ) : (
        <div className="space-y-3">
          {verifiers.map((wallet) => {
            const removing =
              removeVerifier.isPending && removeVerifier.variables === wallet;
            return (
              <div
                key={wallet}
                className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">
                  VF
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-600 font-mono truncate">
                    {wallet}
                  </p>
                </div>
                <Button
                  variant="danger"
                  disabled={removing}
                  onClick={() => onRemoveVerifier(wallet)}
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
    </SectionCard>
  );
};

export default AddVerifierSection;
