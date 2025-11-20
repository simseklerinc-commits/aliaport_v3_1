param(
    [string]$SqlInstance = "(local)",
    [string]$DbName = "Aliaport_v3_1"
)

Write-Host ">>> [$SqlInstance] üzerinde [$DbName] veritabanı kontrol ediliyor..." -ForegroundColor Cyan

# 1) Veritabanını oluştur
$sqlCreateDb = @"
IF DB_ID(N'$DbName') IS NULL
BEGIN
    PRINT 'Creating database $DbName';
    CREATE DATABASE [$DbName];
END
ELSE
BEGIN
    PRINT 'Database $DbName already exists';
END
"@

sqlcmd -S $SqlInstance -E -Q $sqlCreateDb

# 2) Cari tablosu
$sqlCreateCari = @"
USE [$DbName];

IF OBJECT_ID(N'dbo.Cari', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Cari';

    CREATE TABLE dbo.Cari (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        CariKod         NVARCHAR(50)  NOT NULL UNIQUE,
        Unvan           NVARCHAR(200) NOT NULL,
        CariTip         NVARCHAR(20)  NOT NULL,      -- GERCEK / TUZEL
        Rol             NVARCHAR(20)  NOT NULL,      -- MUSTERI / TEDARIKCI / DIGER

        VergiDairesi    NVARCHAR(100) NULL,
        VergiNo         NVARCHAR(20)  NULL,
        Tckn            NVARCHAR(11)  NULL,

        Ulke            NVARCHAR(50)  NULL,
        Il              NVARCHAR(50)  NULL,
        Ilce            NVARCHAR(50)  NULL,
        Adres           NVARCHAR(500) NULL,

        Telefon         NVARCHAR(50)  NULL,
        Eposta          NVARCHAR(100) NULL,
        Iban            NVARCHAR(34)  NULL,

        VadeGun         INT           NULL,
        ParaBirimi      NVARCHAR(10)  NULL,
        AktifMi         BIT           NOT NULL CONSTRAINT DF_Cari_AktifMi DEFAULT(1),

        CreatedAt       DATETIME2     NOT NULL CONSTRAINT DF_Cari_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt       DATETIME2     NULL
    );
END
ELSE
BEGIN
    PRINT 'Table dbo.Cari already exists';
END
"@

$sqlFileCari = Join-Path $PSScriptRoot "Aliaport_v3_1_sql_init_cari.sql"
$sqlCreateCari | Set-Content -Path $sqlFileCari -Encoding UTF8
Write-Host ">>> Cari SQL script: $sqlFileCari" -ForegroundColor Yellow
sqlcmd -S $SqlInstance -E -i $sqlFileCari

# 3) Hizmet (Tarife) tablosu
$sqlCreateHizmet = @"
USE [$DbName];

IF OBJECT_ID(N'dbo.Hizmet', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Hizmet';

    CREATE TABLE dbo.Hizmet (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Kod          NVARCHAR(50)  NOT NULL UNIQUE,
        Ad           NVARCHAR(200) NOT NULL,
        GrupKod      NVARCHAR(50)  NULL,
        Birim        NVARCHAR(20)  NULL,
        Fiyat        DECIMAL(18,4) NULL,
        ParaBirimi   NVARCHAR(10)  NOT NULL CONSTRAINT DF_Hizmet_ParaBirimi DEFAULT('TRY'),
        KdvOrani     DECIMAL(5,2)  NULL,
        SiraNo       INT           NULL,
        AktifMi      BIT           NOT NULL CONSTRAINT DF_Hizmet_AktifMi DEFAULT(1),
        CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Hizmet_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt    DATETIME2     NULL
    );
END
ELSE
BEGIN
    PRINT 'Table dbo.Hizmet already exists';
END
"@

$sqlFileHizmet = Join-Path $PSScriptRoot "Aliaport_v3_1_sql_init_hizmet.sql"
$sqlCreateHizmet | Set-Content -Path $sqlFileHizmet -Encoding UTF8
Write-Host ">>> Hizmet SQL script: $sqlFileHizmet" -ForegroundColor Yellow
sqlcmd -S $SqlInstance -E -i $sqlFileHizmet

# 4) CariSözleşme tablosu
$sqlCreateCariSoz = @"
USE [$DbName];

IF OBJECT_ID(N'dbo.CariSozlesme', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.CariSozlesme';

    CREATE TABLE dbo.CariSozlesme (
        Id                 INT IDENTITY(1,1) PRIMARY KEY,
        CariId             INT           NOT NULL,
        SozlesmeKod        NVARCHAR(50)  NULL,
        SozlesmeAd         NVARCHAR(200) NULL,
        BaslangicTarihi    DATE          NOT NULL,
        BitisTarihi        DATE          NULL,
        VarsayilanVadeGun  INT           NULL,
        VarsayilanPara     NVARCHAR(10)  NULL,
        AktifMi            BIT           NOT NULL CONSTRAINT DF_CariSozlesme_AktifMi DEFAULT(1),
        Notlar             NVARCHAR(1000) NULL,
        CreatedAt          DATETIME2     NOT NULL CONSTRAINT DF_CariSozlesme_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt          DATETIME2     NULL,

        CONSTRAINT FK_CariSozlesme_Cari
            FOREIGN KEY (CariId) REFERENCES dbo.Cari(Id)
    );
END
ELSE
BEGIN
    PRINT 'Table dbo.CariSozlesme already exists';
END
"@

$sqlFileCariSoz = Join-Path $PSScriptRoot "Aliaport_v3_1_sql_init_cari_sozlesme.sql"
$sqlCreateCariSoz | Set-Content -Path $sqlFileCariSoz -Encoding UTF8
Write-Host ">>> CariSozlesme SQL script: $sqlFileCariSoz" -ForegroundColor Yellow
sqlcmd -S $SqlInstance -E -i $sqlFileCariSoz

Write-Host ">>> İşlem bitti." -ForegroundColor Green
