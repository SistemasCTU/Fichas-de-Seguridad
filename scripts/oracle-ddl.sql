-- ============================================
-- SCRIPT DDL PARA ORACLE - SISTEMA DE FICHAS DE SEGURIDAD
-- ============================================
-- COMENTADO: Todo el script de creacion de AUDIT_LOG esta comentado.
-- La auditoria se maneja directamente en la base de datos.
-- Descomentar y ejecutar en DBeaver cuando se habilite la auditoria
-- desde la interfaz web.
-- ============================================
-- NOTA: La tabla Z_FICHASSEGURIDAD ya existe en el esquema IDECURTIT
-- (creada por iDempiere). NO se necesita crearla.
--
-- Este script solo crea la tabla AUDIT_LOG para registrar
-- las acciones de los usuarios en el sistema web.
-- Se crea en el esquema del usuario de conexion (CONSULTA_FSEGURIDAD).
-- ============================================

/*

-- ============================================
-- 1. CREAR SECUENCIA PARA AUDIT_LOG
-- ============================================

CREATE SEQUENCE AUDIT_LOG_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- ============================================
-- 2. CREAR TABLA AUDIT_LOG
-- Registro de acciones: quien vio, descargo, subio, elimino
-- ============================================

CREATE TABLE AUDIT_LOG (
  AUDIT_ID NUMBER(10) PRIMARY KEY,
  AD_USER_ID NUMBER(10) NOT NULL,
  ACTION VARCHAR2(20) NOT NULL,
  TABLE_NAME VARCHAR2(50) NOT NULL,
  RECORD_ID NUMBER(10),
  DESCRIPTION VARCHAR2(500),
  CREATED DATE DEFAULT SYSDATE NOT NULL,

  CONSTRAINT CHK_AUDIT_ACTION CHECK (
    ACTION IN ('VIEW', 'DOWNLOAD', 'PRINT', 'UPLOAD', 'UPDATE', 'DELETE', 'LOGIN')
  )
);

COMMENT ON TABLE AUDIT_LOG IS 'Registro de auditoria de acciones del sistema web de Fichas de Seguridad';

-- ============================================
-- 3. CREAR INDICES
-- ============================================

CREATE INDEX IDX_AUDIT_USER ON AUDIT_LOG(AD_USER_ID);
CREATE INDEX IDX_AUDIT_CREATED ON AUDIT_LOG(CREATED);
CREATE INDEX IDX_AUDIT_ACTION ON AUDIT_LOG(ACTION);

COMMIT;

*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
