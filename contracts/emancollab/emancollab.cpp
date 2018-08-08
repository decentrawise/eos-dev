#include "emancollab.hpp"
#include <eosiolib/action.hpp>

namespace emanate {


void collab::propose(account_name proposer, eosio::name proposal_name, uint32_t price, const std::string &fileHash, approvals_t requested)
{
    prints("collab::propose - step 0\n");
    require_auth( proposer );

    prints("collab::propose - step 1\n");
    proposals proptable( _self, proposer );
    eosio_assert( proptable.find( proposal_name ) == proptable.end(), "proposal with the same name exists" );
    eosio_assert(requested.size() > 0, "you need at least one user");
    
    prints("collab::propose - step 2\n");
    for ( auto &request : requested ) {
        request.accepted = false;
    }
    
    prints("collab::propose - step 3\n");
    proptable.emplace( proposer, [&]( auto& prop ) 
    {
        prop.name      = proposal_name;
        prop.approvals = std::move(requested);
        prop.price     = price;
        prop.fileHash  = fileHash;
    });
    prints("collab::propose - step 4\n");
}

void collab::approve( account_name proposer, eosio::name proposal_name, account_name approver ) 
{
    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.modify( prop_it, proposer, [&]( auto& mprop )
    {
        auto iter = std::find( mprop.approvals.begin(), mprop.approvals.end(), approver );
        eosio_assert( iter != mprop.approvals.end(), "approval is not on the list of requested approvals" );

        require_auth( iter->name );
        iter->accepted = true;
    });

}

void collab::unapprove( account_name proposer, eosio::name proposal_name, account_name unapprover ) 
{
    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.modify( prop_it, proposer, [&]( auto& mprop ) 
    {
        auto iter = std::find( mprop.approvals.begin(), mprop.approvals.end(), unapprover );
        eosio_assert( iter != mprop.approvals.end(), "no approval previously granted" );

        require_auth( iter->name );
        iter->accepted = false;
    });
}

void collab::cancel( account_name proposer, eosio::name proposal_name, account_name canceler ) 
{
    require_auth( canceler );

    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.erase(prop_it);
}

void collab::updatehash(account_name proposer, eosio::name proposal_name, const std::string &fileHash)
{
    require_auth( proposer );

    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.modify( prop_it, proposer, [&]( auto& mprop ) 
    {
        mprop.fileHash = fileHash;
    });
}

void collab::exec( account_name proposer, eosio::name proposal_name, account_name executer, uint32_t seconds )
{
    require_auth( executer );

    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto trx = eosio::transaction();

    uint32_t percentage = 100;
    uint64_t totalPayment = prop_it->price * seconds;
    for( const collab_data &data : prop_it->approvals )
    {
        percentage -= data.percentage;
        eosio::action action( eosio::permission_level( executer, N(active) ), N(eosio.token), N(transfer), transfer{ executer, data.name, eosio::asset(totalPayment * data.percentage / 100, S(4, BEAT)), "" } );
        trx.actions.emplace_back(std::move(action));
    }

    if( percentage > 0 )
    {
        eosio::action action( eosio::permission_level( executer, N(active) ), N(eosio.token), N(transfer), transfer{ executer, proposer, eosio::asset(totalPayment * percentage / 100, S(4, BEAT)), "" } );
        trx.actions.emplace_back(std::move(action));
    }

    trx.send(0, executer);
}

} /// namespace eosio

EOSIO_ABI( emanate::collab, (propose)(approve)(unapprove)(cancel)(updatehash)(exec) )
