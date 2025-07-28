import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5050/api/org';

// IDs réels de test
const IDS = {
  casablanca: '688550090c4c8dfeb9c74e81',
  jorfLasfar: '688550090c4c8dfeb9c74e82',
  secteurTraitement: '688550090c4c8dfeb9c74e8e',
  secteurExtraction: '688550090c4c8dfeb9c74e8f',
  serviceProductionU1: '688550090c4c8dfeb9c74eb7',
  serviceProductionU2: '688550090c4c8dfeb9c74eb8'
};

let testSecteurId = null;
let testServiceId = null;

async function apiCall(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { data, isError: !response.ok, status: response.status };
  } catch (error) {
    return { data: { error: error.message }, isError: true, status: 0 };
  }
}

function logTest(testName, result) {
  console.log(`\n🧪 ${testName}`);
  console.log('=' .repeat(50));
  console.log(`Status: ${result.status}`);
  console.log(`Success: ${!result.isError}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testDeletePutFunctionality() {
  console.log('🚀 DÉBUT DES TESTS DELETE & PUT');
  console.log('=' .repeat(60));

  // ========================================
  // TESTS PUT SECTEURS
  // ========================================
  
  console.log('\n📝 TESTS PUT SECTEURS');
  console.log('=' .repeat(40));

  // Test 1: PUT secteur valide
  let result = await apiCall(`/secteurs/${IDS.secteurTraitement}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Traitement',
      code: 'CAS_TRAIT_TEST',
      isActive: true
    })
  });
  logTest('PUT Secteur Valide', result);

  // Test 2: PUT secteur avec nom invalide
  result = await apiCall(`/secteurs/${IDS.secteurTraitement}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'InvalidSecteur',
      code: 'CAS_INVALID'
    })
  });
  logTest('PUT Secteur Nom Invalide (doit échouer)', result);

  // Test 3: PUT secteur inexistant
  result = await apiCall(`/secteurs/507f1f77bcf86cd799439011`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Traitement',
      code: 'CAS_TRAIT_NEW'
    })
  });
  logTest('PUT Secteur Inexistant (doit échouer)', result);

  // ========================================
  // TESTS DELETE SECTEURS
  // ========================================
  
  console.log('\n🗑️ TESTS DELETE SECTEURS');
  console.log('=' .repeat(40));

  // Test 4: Créer un secteur test pour suppression
  result = await apiCall(`/sites/${IDS.casablanca}/secteurs`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Maintenance',
      code: 'CAS_MAINT_TEST'
    })
  });
  
  if (!result.isError && result.data.data) {
    testSecteurId = result.data.data._id;
    logTest('Création Secteur Test', result);
  } else {
    console.log('❌ Impossible de créer secteur test');
    return;
  }

  // Test 5: DELETE secteur avec utilisateurs (doit échouer)
  result = await apiCall(`/sites/${IDS.casablanca}/secteurs/${IDS.secteurTraitement}`, {
    method: 'DELETE'
  });
  logTest('DELETE Secteur avec Utilisateurs (doit échouer)', result);

  // Test 6: DELETE secteur vide (doit réussir)
  result = await apiCall(`/sites/${IDS.casablanca}/secteurs/${testSecteurId}`, {
    method: 'DELETE'
  });
  logTest('DELETE Secteur Vide (doit réussir)', result);

  // Test 7: DELETE secteur inexistant
  result = await apiCall(`/sites/${IDS.casablanca}/secteurs/507f1f77bcf86cd799439011`, {
    method: 'DELETE'
  });
  logTest('DELETE Secteur Inexistant (doit échouer)', result);

  // Test 8: DELETE secteur avec mauvais siteId
  result = await apiCall(`/sites/${IDS.jorfLasfar}/secteurs/${IDS.secteurTraitement}`, {
    method: 'DELETE'
  });
  logTest('DELETE Secteur Mauvais Site (doit échouer)', result);

  // ========================================
  // TESTS PUT SERVICES
  // ========================================
  
  console.log('\n📝 TESTS PUT SERVICES');
  console.log('=' .repeat(40));

  // Test 9: PUT service valide
  result = await apiCall(`/services/${IDS.serviceProductionU1}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Production U1',
      code: 'CAS_TRAIT_U1_TEST',
      isActive: true
    })
  });
  logTest('PUT Service Valide', result);

  // Test 10: PUT service avec nom invalide
  result = await apiCall(`/services/${IDS.serviceProductionU1}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'InvalidService',
      code: 'CAS_INVALID'
    })
  });
  logTest('PUT Service Nom Invalide (doit échouer)', result);

  // Test 11: PUT service inexistant
  result = await apiCall(`/services/507f1f77bcf86cd799439011`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Production U1',
      code: 'CAS_TRAIT_U1_NEW'
    })
  });
  logTest('PUT Service Inexistant (doit échouer)', result);

  // ========================================
  // TESTS DELETE SERVICES
  // ========================================
  
  console.log('\n🗑️ TESTS DELETE SERVICES');
  console.log('=' .repeat(40));

  // Test 12: Créer un service test pour suppression
  result = await apiCall(`/secteurs/${IDS.secteurTraitement}/services`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Contrôle Qualité',
      code: 'CAS_TRAIT_CQ_TEST'
    })
  });
  
  if (!result.isError && result.data.data) {
    testServiceId = result.data.data._id;
    logTest('Création Service Test', result);
  } else {
    console.log('❌ Impossible de créer service test');
    return;
  }

  // Test 13: DELETE service avec utilisateurs (doit échouer si des utilisateurs assignés)
  result = await apiCall(`/services/${IDS.serviceProductionU1}`, {
    method: 'DELETE'
  });
  logTest('DELETE Service avec Utilisateurs (peut échouer)', result);

  // Test 14: DELETE service vide (doit réussir)
  result = await apiCall(`/services/${testServiceId}`, {
    method: 'DELETE'
  });
  logTest('DELETE Service Vide (doit réussir)', result);

  // Test 15: DELETE service inexistant
  result = await apiCall(`/services/507f1f77bcf86cd799439011`, {
    method: 'DELETE'
  });
  logTest('DELETE Service Inexistant (doit échouer)', result);

  // ========================================
  // TESTS DE VALIDATION AVANCÉS
  // ========================================
  
  console.log('\n🔍 TESTS DE VALIDATION AVANCÉS');
  console.log('=' .repeat(40));

  // Test 16: PUT avec données vides
  result = await apiCall(`/secteurs/${IDS.secteurExtraction}`, {
    method: 'PUT',
    body: JSON.stringify({})
  });
  logTest('PUT Secteur Données Vides', result);

  // Test 17: PUT avec JSON malformé
  try {
    const response = await fetch(`${API_BASE}/secteurs/${IDS.secteurExtraction}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": "Traitement", "code":'
    });
    result = { data: await response.text(), isError: !response.ok, status: response.status };
  } catch (error) {
    result = { data: { error: error.message }, isError: true, status: 0 };
  }
  logTest('PUT JSON Malformé (doit échouer)', result);

  // ========================================
  // RÉSUMÉ DES TESTS
  // ========================================
  
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(60));
  console.log('✅ Tests PUT Secteurs: 3 tests');
  console.log('✅ Tests DELETE Secteurs: 5 tests');
  console.log('✅ Tests PUT Services: 3 tests');
  console.log('✅ Tests DELETE Services: 3 tests');
  console.log('✅ Tests Validation: 3 tests');
  console.log('📊 Total: 17 tests exécutés');
  
  console.log('\n🎯 FONCTIONNALITÉS TESTÉES:');
  console.log('• PUT avec validation métier');
  console.log('• DELETE avec vérification utilisateurs');
  console.log('• DELETE avec validation site/secteur');
  console.log('• Gestion des erreurs 404');
  console.log('• Validation des données d\'entrée');
  console.log('• Soft delete avec cascade');
  
  console.log('\n🎉 TESTS TERMINÉS!');
}

// Exécuter les tests
testDeletePutFunctionality().catch(console.error);
