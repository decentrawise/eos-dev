#include "emancollab.hpp"
#include <eosiolib/action.hpp>

namespace emanate {


void collab::propose(eosio::name proposal_name, uint32_t price, const std::string &fileHash, approvals_t requested)
{
    require_auth( N(emancollab) );

    proposals proptable( _self, N(emancollab) );
    eosio_assert( proptable.find( proposal_name ) == proptable.end(), "proposal with the same name exists" );
    eosio_assert(requested.size() > 0, "you need at least one user");
    
    int total = 0;
    for ( auto &request : requested ) {
        request.accepted = false;
        total += request.percentage;
    }
    
    eosio_assert(total == 100, "the sum of all percentages must be 100");
    
    proptable.emplace( N(emancollab), [&]( auto& prop ) 
    {
        prop.name      = proposal_name;
        prop.approvals = std::move(requested);
        prop.price     = price;
        prop.fileHash  = fileHash;
    });
}

void collab::approve(eosio::name proposal_name, account_name approver ) 
{
    require_auth( N(emancollab) );

    proposals proptable( _self, N(emancollab) );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.modify( prop_it, N(emancollab), [&]( auto& mprop )
    {
        auto iter = std::find( mprop.approvals.begin(), mprop.approvals.end(), approver );
        eosio_assert( iter != mprop.approvals.end(), "approval is not on the list of requested approvals" );

        require_auth( iter->name );
        iter->accepted = true;
    });

}

void collab::unapprove(eosio::name proposal_name, account_name unapprover ) 
{
    require_auth( N(emancollab) );

    proposals proptable( _self, N(emancollab) );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.modify( prop_it, N(emancollab), [&]( auto& mprop ) 
    {
        auto iter = std::find( mprop.approvals.begin(), mprop.approvals.end(), unapprover );
        eosio_assert( iter != mprop.approvals.end(), "no approval previously granted" );

        require_auth( iter->name );
        iter->accepted = false;
    });
}

void collab::cancel(eosio::name proposal_name, account_name canceler ) 
{
    require_auth( N(emancollab) );

    proposals proptable( _self, N(emancollab) );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto iter = std::find( prop_it->approvals.begin(), prop_it->approvals.end(), canceler );
    eosio_assert(iter != prop_it->approvals.end(), "user is not part of the contract");
    require_auth( canceler );
    
    proptable.erase(prop_it);
}

void collab::updatehash(eosio::name proposal_name, account_name userName, const std::string &fileHash)
{
    require_auth( N(emancollab) );

    proposals proptable( _self, N(emancollab) );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto iter = std::find( prop_it->approvals.begin(), prop_it->approvals.end(), userName );
    eosio_assert(iter != prop_it->approvals.end(), "user is not part of the contract");
    require_auth( userName );
    
    proptable.modify( prop_it, N(emancollab), [&]( auto& mprop ) 
    {
        mprop.fileHash = fileHash;
    });
}

void collab::exec(eosio::name proposal_name, account_name executer, uint32_t seconds )
{
    require_auth( N(emancollab) );
    require_auth( executer );

    proposals proptable( _self, N(emancollab) );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto trx = eosio::transaction();

    uint64_t totalPayment = prop_it->price * seconds;
    for( const collab_data &data : prop_it->approvals )
    {
        eosio::action action( eosio::permission_level( executer, N(active) ), N(eosio.token), N(transfer), transfer{ executer, data.name, eosio::asset(totalPayment * data.percentage / 100, S(4, BEAT)), "" } );
        trx.actions.emplace_back(std::move(action));
    }

    trx.send(0, executer);
}

} /// namespace eosio

EOSIO_ABI( emanate::collab, (propose)(approve)(unapprove)(cancel)(updatehash)(exec) )
