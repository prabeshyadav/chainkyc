import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAddBank, useBanks, useRemoveBank } from "../../queries/admin";
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

const AddBankSection = () => {
  const { data: banks = [], isLoading, isError, error } = useBanks();
  const addBank = useAddBank();
  const removeBank = useRemoveBank();
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

  const onAddBank = handleSubmit(({ wallet }) => {
    if (banks.some((v) => v.toLowerCase() === wallet.toLowerCase())) {
      setError("wallet", { message: "This wallet is already a Bank." });
      return;
    }
    addBank.mutate(wallet, {
      onSuccess: () => reset(),
    });
  });

  function onRemoveBank(wallet: string) {
    removeBank.mutate(wallet);
  }

  return (
    <SectionCard
      title="Banks"
      description="Licensed banks allowed to review KYC submissions."
    >
      <form onSubmit={onAddBank} className="flex items-start gap-3 mb-5">
        <div className="flex-1">
          <Input
            label="Bank wallet address"
            hint="0x..."
            error={errors.wallet?.message}
            {...register("wallet")}
          />
          {addBank.isError && (
            <p className="text-xs text-red-600 mt-1">{addBank.error.message}</p>
          )}
        </div>
        <Button type="submit" disabled={addBank.isPending} className="mt-7">
          {addBank.isPending ? "Adding..." : "Add Bank"}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-400">Loading banks...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          Could not load banks: {error.message}
        </p>
      ) : banks.length === 0 ? (
        <p className="text-sm text-ink-400">No banks on the network yet.</p>
      ) : (
        <div className="space-y-3">
          {banks.map((wallet) => {
            const removing =
              removeBank.isPending && removeBank.variables === wallet;
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
                  onClick={() => onRemoveBank(wallet)}
                >
                  {removing ? "Removing..." : "Remove"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {removeBank.isError && (
        <p className="text-sm text-red-600 mt-3">{removeBank.error.message}</p>
      )}
    </SectionCard>
  );
};

export default AddBankSection;
