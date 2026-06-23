-- CreateTable
CREATE TABLE "no_show_predictions" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "no_show_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "no_show_predictions_appointmentId_key" ON "no_show_predictions"("appointmentId");

-- CreateIndex
CREATE INDEX "no_show_predictions_clinicId_idx" ON "no_show_predictions"("clinicId");

-- CreateIndex
CREATE INDEX "no_show_predictions_patientId_idx" ON "no_show_predictions"("patientId");

-- AddForeignKey
ALTER TABLE "no_show_predictions" ADD CONSTRAINT "no_show_predictions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_show_predictions" ADD CONSTRAINT "no_show_predictions_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_show_predictions" ADD CONSTRAINT "no_show_predictions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
