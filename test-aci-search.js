/**
 * Test script for ACI Brave Search Edge Function
 * 
 * This script tests the aci-brave-search Supabase Edge Function
 * to verify that web search functionality works correctly.
 * 
 * Usage: node test-aci-search.js
 */

// Replace with your actual Supabase project URL
const SUPABASE_URL = 'https://aggkhetcdjmggqjzelgd.supabase.co';
const FUNCTION_NAME = 'aci-brave-search';

/**
 * Test the verify-setup action
 */
async function testVerifySetup() {
  console.log('\n🔍 Testing verify-setup action...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual anon key if needed
      },
      body: JSON.stringify({
        action: 'verify-setup'
      })
    });

    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Setup verification successful!');
      return true;
    } else {
      console.log('❌ Setup verification failed');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing verify-setup:', error);
    return false;
  }
}

/**
 * Test the search action with simple queries
 */
async function testSearch() {
  console.log('\n🔍 Testing search action...');
  
  const testQueries = [
    'artificial intelligence news',
    'AI developments 2024',
    'machine learning trends'
  ];
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual anon key if needed
      },
      body: JSON.stringify({
        action: 'search',
        data: {
          queries: testQueries,
          maxResults: 3
        }
      })
    });

    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Search test successful!');
      console.log(`📊 Total results found: ${data.totalResults}`);
      
      // Log details of each query result
      data.results.forEach((result, index) => {
        console.log(`\n🔍 Query ${index + 1}: "${result.query}"`);
        console.log(`   Results: ${result.results?.length || 0}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.results && result.results.length > 0) {
          result.results.slice(0, 2).forEach((searchResult, resultIndex) => {
            console.log(`   ${resultIndex + 1}. ${searchResult.title}`);
            console.log(`      ${searchResult.description?.substring(0, 100)}...`);
            console.log(`      ${searchResult.url}`);
          });
        }
      });
      
      return true;
    } else {
      console.log('❌ Search test failed');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing search:', error);
    return false;
  }
}

/**
 * Test with problematic queries that might cause issues
 */
async function testProblematicQueries() {
  console.log('\n🔍 Testing problematic queries...');
  
  const problematicQueries = [
    '"quoted search term"',  // Test quoted queries
    'what are current ai news related to germany?',  // Test the failing query
    'very long search query with many words that might exceed some limits or cause issues with the API call',
    ''  // Test empty query
  ];
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual anon key if needed
      },
      body: JSON.stringify({
        action: 'search',
        data: {
          queries: problematicQueries.filter(q => q.length > 0), // Remove empty queries
          maxResults: 2
        }
      })
    });

    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Problematic queries test completed');
      return true;
    } else {
      console.log('❌ Problematic queries test failed');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing problematic queries:', error);
    return false;
  }
}

/**
 * Test invalid requests to check error handling
 */
async function testErrorHandling() {
  console.log('\n🔍 Testing error handling...');
  
  const testCases = [
    {
      name: 'Invalid action',
      body: { action: 'invalid-action' }
    },
    {
      name: 'Missing queries',
      body: { action: 'search', data: {} }
    },
    {
      name: 'Empty queries array',
      body: { action: 'search', data: { queries: [] } }
    },
    {
      name: 'Invalid data type',
      body: { action: 'search', data: { queries: 'not-an-array' } }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual anon key if needed
        },
        body: JSON.stringify(testCase.body)
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Error: ${data.error || 'None'}`);
      
    } catch (error) {
      console.error(`   💥 Error: ${error.message}`);
    }
  }
  
  console.log('✅ Error handling tests completed');
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting ACI Brave Search Function Tests');
  console.log('=' .repeat(50));
  
  // Test 1: Verify setup
  const setupOk = await testVerifySetup();
  
  // Test 2: Basic search functionality
  const searchOk = await testSearch();
  
  // Test 3: Problematic queries
  const problematicOk = await testProblematicQueries();
  
  // Test 4: Error handling
  await testErrorHandling();
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   Setup verification: ${setupOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Basic search: ${searchOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Problematic queries: ${problematicOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Error handling: ✅ COMPLETED`);
  
  if (setupOk && searchOk) {
    console.log('\n🎉 All critical tests passed! ACI Brave Search function is working.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Instructions for running the test
console.log('📋 ACI Brave Search Function Test');
console.log('');
console.log('Before running this test:');
console.log('1. Make sure your aci-brave-search function is deployed to Supabase');
console.log('2. Update SUPABASE_URL with your actual project URL');
console.log('3. Replace YOUR_ANON_KEY_HERE with your anon key (if required)');
console.log('4. Ensure ACI_API_KEY and ACI_LINKED_ACCOUNT_OWNER_ID are set in Supabase');
console.log('');
console.log('Run with: node test-aci-search.js');
console.log('');

// Uncomment the line below to run tests automatically
// runAllTests();

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testVerifySetup,
    testSearch,
    testProblematicQueries,
    testErrorHandling,
    runAllTests
  };
} 