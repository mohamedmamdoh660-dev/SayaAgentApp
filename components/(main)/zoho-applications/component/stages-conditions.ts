


export const canUploadCard = (stage: string) => [
    "final acceptance",
    "awaiting student card",
    "awaiting student",
  ].includes(stage);
  export const canUploadPayment = (stage: string) => [
    "conditional acceptance",
    "awaiting payment",
  ].includes(stage);

  export const conditionalButtonDisabled = (stage: string) => [
    "pending review",
    "awaiting conditional acceptance",
  ].includes(stage);

  export const finalAcceptanceButtonDisabled = (stage: string) => [
    "pending review",
    "awaiting conditional acceptance",
    "conditional acceptance",
    "awaiting payment",
    "paid",
    "awaiting final acceptance",
  ].includes(stage);