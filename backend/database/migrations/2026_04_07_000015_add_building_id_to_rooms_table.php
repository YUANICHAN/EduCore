<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('rooms')) {
            return;
        }

        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'building_id')) {
                $table->foreignId('building_id')->nullable()->after('building')->constrained('buildings')->nullOnDelete();
                $table->index('building_id');
            }
        });

        if (Schema::hasColumn('rooms', 'building')) {
            $buildingNames = DB::table('rooms')
                ->select('building')
                ->whereNotNull('building')
                ->where('building', '!=', '')
                ->distinct()
                ->pluck('building');

            foreach ($buildingNames as $buildingName) {
                DB::table('buildings')->updateOrInsert(
                    ['name' => $buildingName],
                    ['status' => 'active', 'updated_at' => now(), 'created_at' => now()]
                );
            }

            $rooms = DB::table('rooms')->select('id', 'building')->whereNull('building_id')->get();
            foreach ($rooms as $room) {
                if (!$room->building) {
                    continue;
                }

                $buildingId = DB::table('buildings')->where('name', $room->building)->value('id');
                if ($buildingId) {
                    DB::table('rooms')->where('id', $room->id)->update(['building_id' => $buildingId]);
                }
            }
        }

        // Keep legacy building text column for backward compatibility.
        // Enforce normalized uniqueness by building_id + room_number for all new data.
        DB::statement('CREATE UNIQUE INDEX rooms_building_id_room_number_unique ON rooms (building_id, room_number)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('rooms')) {
            return;
        }

        DB::statement('DROP INDEX rooms_building_id_room_number_unique ON rooms');

        Schema::table('rooms', function (Blueprint $table) {
            if (Schema::hasColumn('rooms', 'building_id')) {
                $table->dropForeign(['building_id']);
                $table->dropIndex(['building_id']);
                $table->dropColumn('building_id');
            }
        });
    }
};
