/**
 * (c) 2019 Cloverfield – Leprechaun Promotions
 * User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *
 * Module Description
 * Renumbers a Job from a 2-digit Series Number to match the forthcoming 4-digit Series Number sequence.
 *
 * Version      Date            Author            Remarks
 * 0.0.1        02 Jan 2020     mbrazil           Initial Testing Release
 *
 */

function renumberJjob (type, id) {
    /*
    var document_number = nlapiLookupField(type, id, 'tranid');
    var transaction_number = nlapiLookupField(type, id, 'transactionnumber');
    var doc_numbers = nlapiLookupField(type, id, ['tranid', 'transactionnumber']);

    nlapiLogExecution('DEBUG', 'Document Number', document_number);
    nlapiLogExecution('DEBUG', 'Transaction Number', transaction_number);
    nlapiLogExecution('DEBUG', 'Job Numbers', JSON.stringify(doc_numbers));
    */

    nlapiSubmitField(type, id, 'tranid', nlapiLookupField(type, id, 'tranid') + '00');
    nlapiSubmitField(type, id, 'transactionnumber', nlapiLookupField(type, id, 'transactionnumber') + '00');
}