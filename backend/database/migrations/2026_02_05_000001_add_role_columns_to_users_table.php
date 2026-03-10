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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student')->after('password');
            $table->string('status')->default('active')->after('role');
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('address');
            $table->unsignedBigInteger('student_id')->nullable()->after('avatar');
            $table->unsignedBigInteger('teacher_id')->nullable()->after('student_id');
            $table->boolean('account_locked')->default(false)->after('teacher_id');
            $table->timestamp('locked_at')->nullable()->after('account_locked');
            $table->integer('failed_login_attempts')->default(0)->after('locked_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'status',
                'phone',
                'address',
                'avatar',
                'student_id',
                'teacher_id',
                'account_locked',
                'locked_at',
                'failed_login_attempts'
            ]);
        });
    }
};
