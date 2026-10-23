-- DropIndex
DROP INDEX "BusRoute_originTerminalId_destinationTerminalId_key";

-- DropIndex
DROP INDEX "TrainRoute_originStationId_destinationStationId_key";

-- CreateIndex
CREATE INDEX "BusRoute_originTerminalId_destinationTerminalId_idx" ON "BusRoute"("originTerminalId", "destinationTerminalId");

-- CreateIndex
CREATE INDEX "TrainRoute_originStationId_destinationStationId_idx" ON "TrainRoute"("originStationId", "destinationStationId");
