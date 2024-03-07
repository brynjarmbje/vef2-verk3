-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_away_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_home_fkey";

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_home_fkey" FOREIGN KEY ("home") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_away_fkey" FOREIGN KEY ("away") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
