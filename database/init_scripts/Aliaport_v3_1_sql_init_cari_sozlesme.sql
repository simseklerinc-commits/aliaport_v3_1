USE [Aliaport_v3_1];

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
