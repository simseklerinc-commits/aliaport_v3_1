USE [Aliaport_v3_1];

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
