<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('subject_code', 50)->unique();
            $table->string('subject_name');
            $table->text('description')->nullable();
            $table->integer('units');
            $table->integer('credits');
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->string('grade_level', 50);
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->boolean('is_required')->default(true);
            $table->json('prerequisites')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('subjects');
    }
};
